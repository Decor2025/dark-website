import React, { useState, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { database } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { Order } from "../../types";
import {
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Ruler,
  Hash,
  User,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

const ProductionDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ordersRef = ref(database, "orders");
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const ordersData = snapshot.val();
        const ordersList: Order[] = Object.keys(ordersData).map((key) => ({
          id: key,
          ...ordersData[key],
        }));
        setOrders(
          ordersList.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          )
        );
      } else {
        setOrders([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    try {
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        const orderRef = ref(database, `orders/${orderId}`);
        await set(orderRef, {
          ...order,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.email || "production",
        });
        toast.success(`Order ${order.orderNumber} updated to ${newStatus}`);
      }
    } catch (error) {
      toast.error("Failed to update order status");
      console.error("Error updating order status:", error);
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case "in-progress":
        return <AlertCircle className="w-6 h-6 text-blue-500" />;
      case "ready":
        return <Package className="w-6 h-6 text-green-500" />;
      case "completed":
        return <CheckCircle className="w-6 h-6 text-gray-500" />;
      default:
        return null;
    }
  };

  const getNextStatus = (currentStatus: Order["status"]): Order["status"] | null => {
    switch (currentStatus) {
      case "pending":
        return "in-progress";
      case "in-progress":
        return "ready";
      case "ready":
        return "completed";
      default:
        return null;
    }
  };

  const getStatusLabel = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "in-progress":
        return "In Progress";
      case "ready":
        return "Ready";
      case "completed":
        return "Completed";
      default:
        return "";
    }
  };

  const pendingOrders = orders.filter((order) => order.status !== "completed");
  const completedOrders = orders.filter((order) => order.status === "completed");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Production Dashboard
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span>
                {orders.filter((o) => o.status === "pending").length} Pending
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-500" />
              <span>
                {orders.filter((o) => o.status === "in-progress").length} In
                Progress
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-green-500" />
              <span>
                {orders.filter((o) => o.status === "ready").length} Ready
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gray-500" />
              <span>{completedOrders.length} Completed</span>
            </div>
          </div>
        </div>

        {/* Active Orders */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Active Orders
          </h2>
          {pendingOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Active Orders
              </h3>
              <p className="text-gray-600">All orders have been completed!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-sm border-l-4 border-l-blue-500 p-6 hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Hash className="w-4 h-4 text-gray-500" />
                        <span className="font-mono text-lg font-semibold text-gray-900">
                          {order.orderNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{order.customerName}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      {getStatusIcon(order.status)}
                      <span className="text-xs text-gray-500 mt-1 capitalize">
                        {order.status.replace("-", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">
                        {order.orderType} Blinds
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Ruler className="w-3 h-3" />
                        Size:
                      </span>
                      <span className="font-medium">
                        {order.width}" × {order.height}"
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium">{order.quantity}</span>
                    </div>

                    {order.orderType === "normal" && order.fabricCode && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Fabric Code:</span>
                        <span className="font-medium">{order.fabricCode}</span>
                      </div>
                    )}

                    {order.orderType === "wooden" && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Base Size:</span>
                          <span className="font-medium">{order.baseSize}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Color Code:</span>
                          <span className="font-medium">
                            {order.woodenColorCode}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Slats:</span>
                          <span className="font-medium">
                            {order.numberOfSlats}
                          </span>
                        </div>
                        <div>
                          <strong>Operating Side:</strong>{" "}
                          {order.operatingSide}
                        </div>
                        <div>
                          <strong>Ladder Tape:</strong> {order.ladderTapeSize}"
                        </div>
                        <div>
                          <strong>MS Road:</strong> {order.msRoad}"
                        </div>
                        <div>
                          <strong>Channel Uching:</strong>{" "}
                          {order.channelUching?.toFixed(2)}" (
                          {order.channelUchingCm?.toFixed(1)}cm)
                        </div>
                      </>
                    )}
                  </div>

                  {/* Image */}
                  {order.imageUrl && (
                    <div className="mb-4">
                      <img
                        src={order.imageUrl}
                        alt="Product"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Notes */}
                  {order.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">
                        Notes:
                      </h5>
                      <p className="text-sm text-gray-600">{order.notes}</p>
                    </div>
                  )}

                  {/* Status Update Button */}
                  <div className="pt-4 border-t border-gray-200">
                    {getNextStatus(order.status) ? (
                      <button
                        onClick={() =>
                          updateOrderStatus(
                            order.id,
                            getNextStatus(order.status)!
                          )
                        }
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        <span>
                          Mark as {getStatusLabel(getNextStatus(order.status)!)}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="text-center text-green-600 font-medium py-2">
                        Order Completed ✓
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-3">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Created {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recently Completed
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {completedOrders.slice(0, 8).map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-sm p-4 opacity-75"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-medium">
                      {order.orderNumber}
                    </span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="text-sm text-gray-600">{order.customerName}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(order.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionDashboard;
